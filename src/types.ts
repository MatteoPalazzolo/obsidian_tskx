
export interface SecretSettings {
    clientId: string, 
    secretId: string
};

export interface NewSpotifyTrackData {
    name: string,
    album: string,
    artists: string[],
    track_number: number
}