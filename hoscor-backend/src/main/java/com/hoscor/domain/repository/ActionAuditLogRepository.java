package com.hoscor.domain.repository;

import com.hoscor.domain.entity.ActionAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ActionAuditLogRepository extends JpaRepository<ActionAuditLog, Long> {
}
