package com.leedahye.stagepin.favorite;

import com.leedahye.stagepin.auth.MemberSessionAccess;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/favorites")
public class FavoritesController {
    private final FavoritesStore store;
    private final MemberSessionAccess sessions;
    public FavoritesController(FavoritesStore store, MemberSessionAccess sessions) { this.store = store; this.sessions = sessions; }
    @GetMapping
    ResponseEntity<FavoritesStore.State> list(HttpServletRequest request) {
        return response(store.list(expectedMember(request, false)));
    }
    @PostMapping
    ResponseEntity<FavoritesStore.State> change(HttpServletRequest request, @RequestBody FavoritesStore.Change change) {
        return response(store.change(expectedMember(request, true), change));
    }
    @PostMapping("/import")
    ResponseEntity<FavoritesStore.State> merge(HttpServletRequest request, @RequestBody List<FavoritesStore.Change> changes) {
        return response(store.merge(expectedMember(request, true), changes));
    }
    private UUID expectedMember(HttpServletRequest request, boolean write) {
        var member = write ? sessions.requireWriter(request) : sessions.requireMember(request);
        // Precondition only: the header can reject stale account requests, never select an owner.
        if (!member.id().toString().equals(request.getHeader("X-StagePin-Member-Id")))
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT,
                    "로그인 계정이 변경됐어요. 로그인 상태를 다시 확인해 주세요.");
        return member.id();
    }
    private ResponseEntity<FavoritesStore.State> response(FavoritesStore.State state) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(state);
    }
}
