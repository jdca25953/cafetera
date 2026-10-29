package com.cafetera.repository;

import com.cafetera.model.RestockLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RestockLogRepository extends JpaRepository<RestockLog, Long> {

    @EntityGraph(attributePaths = {"ingredient", "user"})
    Page<RestockLog> findByMachineIdOrderByRestockedAtDesc(Long machineId, Pageable pageable);
}
