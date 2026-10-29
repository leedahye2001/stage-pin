package com.leedahye.stagepin.search;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class PopularSearchControllerTest {
    @Test
    void listsTermsWithoutCountingAndValidatesSubmissions() throws Exception {
        PopularSearchService service = mock(PopularSearchService.class);
        when(service.findPopular()).thenReturn(new PopularSearchService.PopularSearchResponse(true,
                List.of(new PopularSearchService.PopularTerm("DAY6", 0))));
        var mvc = MockMvcBuilders.standaloneSetup(new PopularSearchController(service)).build();
        mvc.perform(get("/api/v1/search/popular")).andExpect(status().isOk())
                .andExpect(jsonPath("$.initial").value(true)).andExpect(jsonPath("$.items[0].term").value("DAY6"));
        verify(service, never()).record(any());
        verify(service).findPopular();
        mvc.perform(post("/api/v1/search/popular").contentType(MediaType.APPLICATION_JSON).content("{\"query\":\"데이식스\"}"))
                .andExpect(status().isNoContent());
        verify(service).record("데이식스");
        mvc.perform(post("/api/v1/search/popular").contentType(MediaType.APPLICATION_JSON).content("{\"query\":\" \"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/search/popular").contentType(MediaType.APPLICATION_JSON).content("{\"query\":\"" + "x".repeat(101) + "\"}"))
                .andExpect(status().isBadRequest());
        verifyNoMoreInteractions(service);
    }
}
