package com.cafetera.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static ResponseEntity<Map<String, Object>> body(HttpStatus status, String error, Map<String, Object> extra) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("error", error);
        if (extra != null) m.putAll(extra);
        return ResponseEntity.status(status).body(m);
    }

    @ExceptionHandler(NotFoundException.class)
    ResponseEntity<Map<String, Object>> notFound(NotFoundException e) {
        return body(HttpStatus.NOT_FOUND, e.getMessage(), null);
    }

    @ExceptionHandler(BusinessException.class)
    ResponseEntity<Map<String, Object>> business(BusinessException e) {
        return body(HttpStatus.BAD_REQUEST, e.getMessage(), null);
    }

    @ExceptionHandler(InsufficientStockException.class)
    ResponseEntity<Map<String, Object>> stock(InsufficientStockException e) {
        return body(HttpStatus.CONFLICT, "Stock insuficiente", Map.of("ingredients", e.getIngredients()));
    }

    @ExceptionHandler(PriceChangedException.class)
    ResponseEntity<Map<String, Object>> price(PriceChangedException e) {
        return body(HttpStatus.CONFLICT, "Precio modificado", Map.of("currentPrice", e.getCurrentPrice()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Map<String, Object>> invalid(MethodArgumentNotValidException e) {
        Map<String, String> fields = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors().forEach(f -> fields.putIfAbsent(f.getField(), f.getDefaultMessage()));
        return body(HttpStatus.BAD_REQUEST, "Datos no válidos", Map.of("fields", fields));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<Map<String, Object>> unreadable(HttpMessageNotReadableException e) {
        return body(HttpStatus.BAD_REQUEST, "Cuerpo de la petición no válido", null);
    }

    @ExceptionHandler(BadCredentialsException.class)
    ResponseEntity<Map<String, Object>> credentials(BadCredentialsException e) {
        return body(HttpStatus.UNAUTHORIZED, "Credenciales incorrectas", null);
    }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<Map<String, Object>> denied(AccessDeniedException e) {
        return body(HttpStatus.FORBIDDEN, "No tienes permiso para esta operación", null);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<Map<String, Object>> integrity(DataIntegrityViolationException e) {
        return body(HttpStatus.CONFLICT, "La operación choca con datos existentes (duplicado o en uso)", null);
    }
}
