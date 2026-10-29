package com.cafetera.repository;

import com.cafetera.model.MachineStock;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface MachineStockRepository extends JpaRepository<MachineStock, Long> {

    // Con bloqueo (SELECT ... FOR UPDATE). Orden fijo para evitar deadlocks.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select s from MachineStock s
            where s.machineId = :machineId and s.ingredientId in :ids
            order by s.ingredientId""")
    List<MachineStock> findForUpdate(@Param("machineId") Long machineId,
                                     @Param("ids") Collection<Long> ids);

    // Sin bloqueo (para presupuestos)
    @Query("""
            select s from MachineStock s
            where s.machineId = :machineId and s.ingredientId in :ids""")
    List<MachineStock> findByMachineAndIngredients(@Param("machineId") Long machineId,
                                                   @Param("ids") Collection<Long> ids);

    List<MachineStock> findByMachineId(Long machineId);

    @Modifying(clearAutomatically = true)
    @Query("delete from MachineStock s where s.ingredientId = :ingredientId")
    void removeAllForIngredient(@Param("ingredientId") Long ingredientId);
}
