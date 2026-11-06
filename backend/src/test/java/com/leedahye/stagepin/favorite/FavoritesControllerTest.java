package com.leedahye.stagepin.favorite;

import com.leedahye.stagepin.auth.MemberAuthStore;
import com.leedahye.stagepin.auth.MemberSessionAccess;
import com.leedahye.stagepin.common.error.ApiErrorHandler;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class FavoritesControllerTest {
    FavoritesStore store;
    MemberSessionAccess sessions;
    MockMvc mvc;
    UUID member = UUID.randomUUID();
    @BeforeEach void setup() {
        store = mock(FavoritesStore.class);
        sessions = mock(MemberSessionAccess.class);
        var profile = new MemberAuthStore.Member(member, "팬", null, null);
        when(sessions.requireMember(any())).thenReturn(profile);
        when(sessions.requireWriter(any())).thenReturn(profile);
        var state = new FavoritesStore.State(List.of(), List.of());
        when(store.list(any())).thenReturn(state);
        when(store.change(any(), any())).thenReturn(state);
        mvc = MockMvcBuilders.standaloneSetup(new FavoritesController(store, sessions))
                .setControllerAdvice(new ApiErrorHandler()).build();
    }
    @Test void usesSessionOwnerForReadsAndWrites() throws Exception {
        mvc.perform(get("/api/v1/favorites").header("X-StagePin-Member-Id", member)).andExpect(status().isOk()).andExpect(header().string("Cache-Control", "no-store"));
        verify(store).list(member);
        mvc.perform(post("/api/v1/favorites").header("X-StagePin-Member-Id", member).contentType("application/json")
                .content("{\"kind\":\"ARTIST\",\"id\":\"day6\",\"selected\":false}"))
                .andExpect(status().isOk());
        verify(store).change(eq(member), any());
    }
    @Test void unauthorizedAndWrongOriginNeverReachPersistence() throws Exception {
        when(sessions.requireMember(any())).thenThrow(new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        when(sessions.requireWriter(any())).thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN));
        mvc.perform(get("/api/v1/favorites")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/favorites").contentType("application/json")
                .content("{\"kind\":\"ARTIST\",\"id\":\"day6\",\"selected\":false}"))
                .andExpect(status().isForbidden());
        verifyNoInteractions(store);
    }
    @Test void staleOrForgedMemberPreconditionCannotReadOrWriteAnotherAccount() throws Exception {
        mvc.perform(get("/api/v1/favorites")).andExpect(status().isConflict());
        mvc.perform(get("/api/v1/favorites").header("X-StagePin-Member-Id", UUID.randomUUID()))
                .andExpect(status().isConflict());
        mvc.perform(post("/api/v1/favorites").header("X-StagePin-Member-Id", UUID.randomUUID())
                .contentType("application/json").content("{\"kind\":\"ARTIST\",\"id\":\"day6\",\"selected\":false}"))
                .andExpect(status().isConflict());
        verifyNoInteractions(store);
    }
    @Test void removedImportEndpointIsNotMapped() throws Exception {
        mvc.perform(post("/api/v1/favorites/import").header("X-StagePin-Member-Id", member)
                .contentType("application/json").content("[]")).andExpect(status().isNotFound());
        verifyNoInteractions(store);
    }
}
