package com.cafetera.repository;

import com.cafetera.model.Machine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MachineRepository extends JpaRepository<Machine, Long> {
    Optional<Machine> findByCode(String code);
    boolean existsByCode(String code);
    List<Machine> findAllByOrderByNameAsc();
}
