package com.cafetera.service;

import com.cafetera.dto.DTOs.MachineView;
import com.cafetera.exception.NotFoundException;
import com.cafetera.model.AppUser;
import com.cafetera.model.Machine;
import com.cafetera.repository.AppUserRepository;
import com.cafetera.repository.MachineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class MachineService {

    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 símbolos, sin 0/O/1/I
    private static final SecureRandom RNG = new SecureRandom();

    private final MachineRepository repo;
    private final AppUserRepository userRepo;

    @Transactional
    public MachineView create(String name) {
        String code;
        do { code = randomCode(); } while (repo.existsByCode(code));
        Machine m = new Machine();
        m.setCode(code);
        m.setName(name.trim());
        return toView(repo.save(m));   // si dos peticiones colisionan, lo impide la UNIQUE
    }

    @Transactional(readOnly = true)
    public Machine getByCode(String code) {
        return repo.findByCode(code.trim().toUpperCase(Locale.ROOT))
                .filter(Machine::isActive)
                .orElseThrow(() -> new NotFoundException("Cafetera " + code));
    }

    @Transactional(readOnly = true)
    public MachineView view(String code) {
        return toView(getByCode(code));
    }

    @Transactional(readOnly = true)
    public List<MachineView> listAll() {
        return repo.findAllByOrderByNameAsc().stream().map(this::toView).toList();
    }

    /** Cafeteras que puede gestionar un usuario: todas si es admin, las asignadas si es operador. */
    @Transactional(readOnly = true)
    public List<MachineView> forUser(Long userId, boolean admin) {
        if (admin) return listAll();
        AppUser u = userRepo.findById(userId).orElseThrow(() -> new NotFoundException("Usuario " + userId));
        return u.getMachines().stream()
                .filter(Machine::isActive)
                .sorted(Comparator.comparing(Machine::getName))
                .map(this::toView).toList();
    }

    private MachineView toView(Machine m) {
        return new MachineView(m.getCode(), m.getName(), m.isActive(), m.getCreatedAt());
    }

    private static String randomCode() {
        StringBuilder sb = new StringBuilder(8);
        for (int i = 0; i < 8; i++) sb.append(ALPHABET.charAt(RNG.nextInt(ALPHABET.length())));
        return sb.toString();
    }
}
