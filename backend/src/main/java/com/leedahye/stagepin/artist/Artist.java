package com.leedahye.stagepin.artist;

import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class Artist {
    @Id
    private UUID id;
    private String name;
    private String imageUrl;

    protected Artist() {
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getImageUrl() {
        return imageUrl;
    }
}

