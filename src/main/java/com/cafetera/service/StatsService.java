package com.cafetera.service;

import com.cafetera.dto.DTOs.*;
import com.cafetera.exception.BusinessException;
import com.cafetera.model.Machine;
import com.cafetera.repository.ServingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final ServingRepository servingRepo;
    private final MachineService machineService;

    @Transactional(readOnly = true)
    public StatsView forMachine(String code, LocalDate from, LocalDate to) {
        Machine m = machineService.getByCode(code);
        return build(m.getId(), from, to);
    }

    @Transactional(readOnly = true)
    public StatsView global(LocalDate from, LocalDate to) {
        return build(null, from, to);
    }

    @Transactional(readOnly = true)
    public List<MachineStat> byMachine(LocalDate from, LocalDate to) {
        LocalDate[] r = range(from, to);
        return servingRepo.byMachine(start(r[0]), endExclusive(r[1])).stream()
                .map(o -> new MachineStat((String) o[0], (String) o[1], toLong(o[2]), toBig(o[3])))
                .toList();
    }

    // ---------- privados ----------

    private StatsView build(Long machineId, LocalDate from, LocalDate to) {
        LocalDate[] r = range(from, to);
        Instant f = start(r[0]), t = endExclusive(r[1]);

        Object[] tot = servingRepo.totals(machineId, f, t).get(0);
        List<CoffeeStat> top = servingRepo.topCoffees(machineId, f, t).stream()
                .map(o -> new CoffeeStat((String) o[0], toLong(o[1]), toBig(o[2]))).toList();
        List<IngredientUsage> usage = servingRepo.usage(machineId, f, t).stream()
                .map(o -> new IngredientUsage((String) o[0], (String) o[1], toBig(o[2]))).toList();

        return new StatsView(r[0], r[1], toLong(tot[0]), toBig(tot[1]), toLong(tot[2]), top, usage);
    }

    /** Por defecto: últimos 30 días hasta hoy (UTC). */
    private LocalDate[] range(LocalDate from, LocalDate to) {
        LocalDate end = to != null ? to : LocalDate.now(ZoneOffset.UTC);
        LocalDate begin = from != null ? from : end.minusDays(30);
        if (begin.isAfter(end)) throw new BusinessException("La fecha 'from' no puede ser posterior a 'to'");
        return new LocalDate[]{begin, end};
    }

    private static Instant start(LocalDate d)        { return d.atStartOfDay(ZoneOffset.UTC).toInstant(); }
    private static Instant endExclusive(LocalDate d) { return d.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant(); }

    private static long toLong(Object o)       { return o == null ? 0L : ((Number) o).longValue(); }
    private static BigDecimal toBig(Object o)  { return o == null ? BigDecimal.ZERO : new BigDecimal(o.toString()); }
}
