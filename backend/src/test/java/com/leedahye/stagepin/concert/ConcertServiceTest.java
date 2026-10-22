package com.leedahye.stagepin.concert;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.leedahye.stagepin.common.error.NotFoundException;

@ExtendWith(MockitoExtension.class)
class ConcertServiceTest {
    @Mock
    private ConcertRepository concertRepository;

    @Test
    void throwsNotFoundWhenConcertDoesNotExist() {
        UUID id = UUID.randomUUID();
        when(concertRepository.findById(id)).thenReturn(Optional.empty());

        ConcertService service = new ConcertService(concertRepository);

        assertThatThrownBy(() -> service.findById(id))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Concert not found: " + id);
    }
}

