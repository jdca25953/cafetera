package com.cafetera.repository;

import com.cafetera.model.Serving;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface ServingRepository extends JpaRepository<Serving, Long> {

    Page<Serving> findByMachineIdOrderByServedAtDesc(Long machineId, Pageable pageable);

    // En todas las consultas, mid = null significa "todas las cafeteras".
    // Devuelven Object[] para no depender del nombre del paquete de los DTO.

    @Query("""
            select s.coffeeName, count(s), sum(s.price) from Serving s
            where (:mid is null or s.machine.id = :mid) and s.servedAt >= :from and s.servedAt < :to
            group by s.coffeeName order by count(s) desc""")
    List<Object[]> topCoffees(@Param("mid") Long mid, @Param("from") Instant from, @Param("to") Instant to);

    @Query("""
            select i.ingredientName, i.unit, sum(i.quantity) from ServingItem i
            where (:mid is null or i.serving.machine.id = :mid)
              and i.serving.servedAt >= :from and i.serving.servedAt < :to
            group by i.ingredientName, i.unit order by sum(i.quantity) desc""")
    List<Object[]> usage(@Param("mid") Long mid, @Param("from") Instant from, @Param("to") Instant to);

    @Query("""
            select count(s), sum(s.price), sum(case when s.customized = true then 1 else 0 end) from Serving s
            where (:mid is null or s.machine.id = :mid) and s.servedAt >= :from and s.servedAt < :to""")
    List<Object[]> totals(@Param("mid") Long mid, @Param("from") Instant from, @Param("to") Instant to);

    @Query("""
            select s.machine.code, s.machine.name, count(s), sum(s.price) from Serving s
            where s.servedAt >= :from and s.servedAt < :to
            group by s.machine.code, s.machine.name order by count(s) desc""")
    List<Object[]> byMachine(@Param("from") Instant from, @Param("to") Instant to);
}
