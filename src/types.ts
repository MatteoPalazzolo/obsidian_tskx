
export interface SecretSettings {
    spotify: {
        clientId: string, 
        secretId: string    
    }
};

export interface NewSpotifyTrackData {
    name: string,
    album: string,
    artists: string[],
    track_number: number
}

export interface NewSpotifyAlbumData {
    name: string
}

export interface NewSpotifyArtistData {
    name: string
}
