package com.cafetera.repository;

import com.cafetera.model.AppUser;
import com.cafetera.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByRole(Role role);

    long countByRoleAndActiveTrue(Role role);

    @Query("""
            select count(m) from AppUser u join u.machines m
            where u.id = :userId and u.active = true and m.code = :code""")
    long countAccess(@Param("userId") Long userId, @Param("code") String code);

    default boolean hasAccess(Long userId, String code) {
        return countAccess(userId, code) > 0;
    }
}
