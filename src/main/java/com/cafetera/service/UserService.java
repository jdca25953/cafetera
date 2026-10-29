package com.cafetera.service;

import com.cafetera.dto.DTOs.*;
import com.cafetera.exception.BusinessException;
import com.cafetera.exception.NotFoundException;
import com.cafetera.model.AppUser;
import com.cafetera.model.Machine;
import com.cafetera.model.Role;
import com.cafetera.repository.AppUserRepository;
import com.cafetera.repository.MachineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final AppUserRepository userRepo;
    private final MachineRepository machineRepo;
    private final PasswordEncoder encoder;

    @Transactional(readOnly = true)
    public List<UserView> findAll() {
        return userRepo.findAll().stream().map(this::toView).toList();
    }

    @Transactional
    public UserView create(UserRequest req) {
        String username = req.username().trim();
        if (userRepo.existsByUsername(username))
            throw new BusinessException("Ya existe un usuario llamado " + username);
        checkPassword(req.password(), true);

        AppUser u = new AppUser();
        u.setUsername(username);
        u.setPasswordHash(encoder.encode(req.password()));
        u.setRole(req.role());
        u.setActive(req.active() == null || req.active());
        u.setMachines(resolveMachines(req.machineCodes()));
        return toView(userRepo.save(u));
    }

    @Transactional
    public UserView update(Long id, UserRequest req) {
        AppUser u = getOrThrow(id);
        String username = req.username().trim();
        userRepo.findByUsername(username)
                .filter(other -> !other.getId().equals(id))
                .ifPresent(o -> { throw new BusinessException("Ya existe un usuario llamado " + username); });

        boolean newActive = req.active() == null ? u.isActive() : req.active();
        boolean losesAdmin = u.getRole() == Role.ADMIN && u.isActive()
                && (req.role() != Role.ADMIN || !newActive);
        if (losesAdmin) ensureAnotherAdmin();

        u.setUsername(username);
        u.setRole(req.role());
        u.setActive(newActive);
        if (req.password() != null && !req.password().isBlank()) {
            checkPassword(req.password(), false);
            u.setPasswordHash(encoder.encode(req.password()));
        }
        if (req.machineCodes() != null) u.setMachines(resolveMachines(req.machineCodes()));
        return toView(u);
    }

    /** Desactiva (no borra) para conservar la auditoría de reposiciones. */
    @Transactional
    public void deactivate(Long id) {
        AppUser u = getOrThrow(id);
        if (u.getRole() == Role.ADMIN && u.isActive()) ensureAnotherAdmin();
        u.setActive(false);
    }

    // ---------- privados ----------

    private AppUser getOrThrow(Long id) {
        return userRepo.findById(id).orElseThrow(() -> new NotFoundException("Usuario " + id));
    }

    private void ensureAnotherAdmin() {
        if (userRepo.countByRoleAndActiveTrue(Role.ADMIN) <= 1)
            throw new BusinessException("Debe quedar al menos un administrador activo");
    }

    private void checkPassword(String password, boolean required) {
        if (password == null || password.isBlank()) {
            if (required) throw new BusinessException("La contraseña es obligatoria");
            return;
        }
        if (password.length() < 8) throw new BusinessException("La contraseña debe tener al menos 8 caracteres");
    }

    private Set<Machine> resolveMachines(Set<String> codes) {
        Set<Machine> result = new HashSet<>();
        if (codes == null) return result;
        for (String code : codes) {
            result.add(machineRepo.findByCode(code.trim().toUpperCase(Locale.ROOT))
                    .orElseThrow(() -> new NotFoundException("Cafetera " + code)));
        }
        return result;
    }

    private UserView toView(AppUser u) {
        return new UserView(u.getId(), u.getUsername(), u.getRole(), u.isActive(),
                u.getMachines().stream().map(Machine::getCode).collect(Collectors.toCollection(java.util.TreeSet::new)));
    }
}
