
export interface SecretSettings {
    clientId: string, 
    secretId: string
};

export interface NewSpotifyTrackData {
    filename: string,
    name: string,
    album: string,
    artists: string[],
    track_number: number
}