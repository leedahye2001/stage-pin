package com.leedahye.stagepin.auth;

import jakarta.servlet.http.Cookie;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.server.ResponseStatusException;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class MemberSessionAccessTest {
    final MemberAuthStore store = mock(MemberAuthStore.class);
    final MemberSessionAccess guard = new MemberSessionAccess(store,
            new KakaoAuthSettings("", "", "http://localhost:8080/callback", "http://localhost:8081"));
    final String token = "t".repeat(43);

    @Test
    void expiresRejectsAndHeaderNeverFallsBackToCookie() {
        var request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Basic bogus");
        request.setCookies(new Cookie("stagepin_session", token));
        assertThatThrownBy(() -> guard.requireMember(request)).isInstanceOfSatisfying(ResponseStatusException.class,
                error -> assertThat(error.getStatusCode().value()).isEqualTo(401));
        verify(store).me(isNull(), any());
    }

    @Test
    void validNativeSessionCanWriteWithoutWebOriginAndInvalidSessionCannot() {
        var request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        var member = new MemberAuthStore.Member(UUID.randomUUID(), "팬", null, null);
        when(store.me(eq(token), any())).thenReturn(member).thenReturn(null);
        assertThat(guard.requireWriter(request)).isEqualTo(member);
        assertThatThrownBy(() -> guard.requireWriter(request)).isInstanceOfSatisfying(ResponseStatusException.class,
                error -> assertThat(error.getStatusCode().value()).isEqualTo(401));
    }
}
