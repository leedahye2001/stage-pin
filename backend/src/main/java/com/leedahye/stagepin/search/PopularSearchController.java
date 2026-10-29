package com.leedahye.stagepin.search;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/search/popular")
public class PopularSearchController {
    private final PopularSearchService service;

    public PopularSearchController(PopularSearchService service) { this.service = service; }

    @GetMapping
    PopularSearchService.PopularSearchResponse findPopular() { return service.findPopular(); }

    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void record(@Valid @RequestBody SearchRequest request) { service.record(request.query()); }

    record SearchRequest(@NotBlank @Size(max = 100) String query) { }
}
