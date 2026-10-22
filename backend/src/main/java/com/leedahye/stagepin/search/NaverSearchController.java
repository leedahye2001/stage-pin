package com.leedahye.stagepin.search;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/search")
public class NaverSearchController {
    private final NaverSearchClient naverSearchClient;

    public NaverSearchController(NaverSearchClient naverSearchClient) {
        this.naverSearchClient = naverSearchClient;
    }

    @GetMapping("/naver")
    NaverSearchResponse searchNaver(@RequestParam String query) {
        return naverSearchClient.search(query);
    }
}
