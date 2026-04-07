package com.hoscor.config;

import com.hoscor.domain.entity.AppUser;
import com.hoscor.domain.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Ensures demo accounts always exist and have correctly encoded passwords.
 * Runs after Spring context is ready, after SQL init scripts.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final AppUserRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    private static final List<Map<String, String>> DEMO_USERS = List.of(
        Map.of("username", "admin",    "password", "password", "role", "ROLE_ADMIN",            "email", "admin@hoscor.ca"),
        Map.of("username", "coord1",   "password", "password", "role", "ROLE_COORDONNATEUR",    "email", "coord1@hoscor.ca"),
        Map.of("username", "urgence1", "password", "password", "role", "ROLE_URGENCE",          "email", "urgence1@hoscor.ca"),
        Map.of("username", "gestlit1", "password", "password", "role", "ROLE_GESTIONNAIRE_LIT", "email", "gestlit1@hoscor.ca"),
        Map.of("username", "hygiene1", "password", "password", "role", "ROLE_HYGIENE",          "email", "hygiene1@hoscor.ca"),
        Map.of("username", "nurse1",   "password", "password", "role", "ROLE_URGENCE",          "email", "nurse1@hoscor.ca")
    );

    @Override
    public void run(ApplicationArguments args) {
        for (Map<String, String> demo : DEMO_USERS) {
            String username = demo.get("username");
            userRepo.findByUsername(username).ifPresentOrElse(
                user -> {
                    // Ensure active and re-encode password on each startup so demo always works
                    user.setPasswordHash(passwordEncoder.encode(demo.get("password")));
                    user.setActive(true);
                    userRepo.save(user);
                    log.info("Demo user '{}' refreshed.", username);
                },
                () -> {
                    AppUser newUser = AppUser.builder()
                            .username(username)
                            .passwordHash(passwordEncoder.encode(demo.get("password")))
                            .role(demo.get("role"))
                            .email(demo.get("email"))
                            .active(true)
                            .createdAt(LocalDateTime.now())
                            .build();
                    userRepo.save(newUser);
                    log.info("Demo user '{}' created.", username);
                }
            );
        }
        log.info("Demo accounts ready: admin / coord1 / urgence1 / gestlit1 / hygiene1 / nurse1 (password: 'password')");
    }
}
