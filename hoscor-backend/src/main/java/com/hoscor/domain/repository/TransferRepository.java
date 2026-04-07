package com.hoscor.domain.repository;

import com.hoscor.domain.entity.Transfer;
import com.hoscor.domain.enums.TransferStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransferRepository extends JpaRepository<Transfer, Long> {

    List<Transfer> findByStatus(TransferStatus status);

    List<Transfer> findByPatient_Id(Long patientId);

    @Query("SELECT t FROM Transfer t WHERE t.status = :pending OR FUNCTION('DATE', t.scheduledAt) = FUNCTION('CURRENT_DATE') ORDER BY t.scheduledAt")
    List<Transfer> findTodayAndPending(@Param("pending") TransferStatus pending);

    long countByStatusIn(List<TransferStatus> statuses);

    List<Transfer> findAllByOrderByScheduledAtDesc();
}
