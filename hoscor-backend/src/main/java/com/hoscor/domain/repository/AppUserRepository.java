package com.hoscor.domain.repository;

import com.hoscor.domain.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AppUserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByUsername(String username);
    Optional<AppUser> findByEmail(String email);
    Optional<AppUser> findByValidationToken(String token);
    Optional<AppUser> findByResetToken(String token);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}
