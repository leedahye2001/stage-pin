package com.leedahye.stagepin.concert;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
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
    @Mock
    private KopisConcertClient kopisConcertClient;

    @Test
    void throwsNotFoundWhenConcertDoesNotExist() {
        UUID id = UUID.randomUUID();
        when(concertRepository.findById(id)).thenReturn(Optional.empty());

        when(kopisConcertClient.findById(eq(id), any(), eq(ConcertGenre.POPULAR_MUSIC))).thenReturn(null);
        ConcertService service = new ConcertService(concertRepository, kopisConcertClient);

        assertThatThrownBy(() -> service.findById(id, ConcertGenre.POPULAR_MUSIC))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Concert not found: " + id);
    }

    @Test
    void delegatesSearchToKopis() {
        when(kopisConcertClient.search("DAY6", ConcertGenre.POPULAR_MUSIC)).thenReturn(List.of());
        ConcertService service = new ConcertService(concertRepository, kopisConcertClient);

        assertThat(service.search("DAY6", ConcertGenre.POPULAR_MUSIC)).isEmpty();
        verify(kopisConcertClient).search("DAY6", ConcertGenre.POPULAR_MUSIC);
    }
}
