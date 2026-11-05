package com.leedahye.stagepin.goods;

import com.leedahye.stagepin.auth.KakaoAuthSettings;
import com.leedahye.stagepin.auth.MemberAuthStore;
import com.leedahye.stagepin.auth.MemberSessionAccess;
import com.leedahye.stagepin.common.error.ApiErrorHandler;
import com.leedahye.stagepin.common.error.NotFoundException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import tools.jackson.databind.json.JsonMapper;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class GoodsControllerTest {
    GoodsService goods;
    MemberSessionAccess access;
    MockMvc mvc;
    final UUID owner = UUID.randomUUID(), listing = UUID.randomUUID();

    @BeforeEach
    void setup() {
        goods = mock(GoodsService.class);
        access = mock(MemberSessionAccess.class);
        when(access.requireWriter(any())).thenReturn(new MemberAuthStore.Member(owner, "팬", null, "private@example.com"));
        when(access.requireMember(any())).thenReturn(new MemberAuthStore.Member(owner, "팬", null, null));
        mvc = MockMvcBuilders.standaloneSetup(new GoodsController(goods, access, JsonMapper.builder().build()))
                .setControllerAdvice(new ApiErrorHandler()).build();
    }

    @Test
    void createUsesSessionOwnerAndNeverExposesEmail() throws Exception {
        var response = new GoodsResponse(listing, owner, "팬", "DAY6", "포카", "SALE", 12000L,
                "", "SEALED", "", false, true, null, Instant.now(), List.of());
        when(goods.create(eq(owner), any(), any())).thenReturn(response);
        mvc.perform(multipart("/api/v1/goods").file(GoodsServiceTest.photo())
                .param("metadata", JsonMapper.builder().build().writeValueAsString(GoodsServiceTest.sale())))
                .andExpect(status().isCreated()).andExpect(header().string("Location", "/api/v1/goods/" + listing))
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.ownerId").value(owner.toString()))
                .andExpect(jsonPath("$.email").doesNotExist());
        verify(goods).create(eq(owner), any(), any());
        mvc.perform(get("/api/v1/goods/mine")).andExpect(status().isOk());
        verify(goods).list(owner, 0);
    }

    @Test
    void unauthorizedUploadDoesNotSaveAndPublicReadsDoNotRequireLogin() throws Exception {
        when(access.requireWriter(any())).thenThrow(new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.UNAUTHORIZED, "로그인이 필요해요."));
        mvc.perform(multipart("/api/v1/goods").param("metadata", "{}"))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(goods);
        mvc.perform(get("/api/v1/goods")).andExpect(status().isOk());
        verify(goods).list(null, 0);
    }

    @Test
    void invalidMetadataAndMissingPhotoAreNotAcceptedSilently() throws Exception {
        mvc.perform(multipart("/api/v1/goods").param("metadata", "not-json"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(goods);
        when(goods.photo(any())).thenThrow(new NotFoundException("사진을 찾을 수 없어요."));
        mvc.perform(get("/api/v1/goods/photos/" + UUID.randomUUID())).andExpect(status().isNotFound());
    }

    @Test
    void photoUsesFixedContentTypeAndNosniff() throws Exception {
        when(goods.photo(any())).thenReturn(new byte[]{1, 2});
        mvc.perform(get("/api/v1/goods/photos/" + UUID.randomUUID())).andExpect(status().isOk())
                .andExpect(content().contentType("image/jpeg"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"));
    }

    @Test
    void cookieWritesRejectMissingAndForeignOriginAndNativeWritesRequireSession() {
        var store = mock(MemberAuthStore.class);
        var settings = new KakaoAuthSettings("", "", "http://localhost:8080/callback", "http://localhost:8081");
        var guard = new MemberSessionAccess(store, settings);
        var request = new org.springframework.mock.web.MockHttpServletRequest();
        request.setCookies(new Cookie("stagepin_session", "a".repeat(43)));
        // me() is package-private; use a mock guard lookup via the public method spy instead.
        var authenticated = spy(guard);
        doReturn(new MemberAuthStore.Member(owner, "팬", null, null)).when(authenticated).requireMember(any());
        assertThatThrownBy(() -> authenticated.requireWriter(request)).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        request.addHeader("Origin", "https://evil.example.com");
        assertThatThrownBy(() -> authenticated.requireWriter(request)).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        request.removeHeader("Origin"); request.addHeader("Origin", "http://localhost:8081");
        assertThat(authenticated.requireWriter(request).id()).isEqualTo(owner);
        assertThatThrownBy(() -> guard.requireMember(new org.springframework.mock.web.MockHttpServletRequest()))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
    }
}
