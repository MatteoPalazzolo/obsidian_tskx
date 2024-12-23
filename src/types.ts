
export interface SecretSettings {
    clientId: string, 
    secretId: string
};

export interface NewSpotifyTrackData {
    name: string,
    artists: { name: string }[],
    track_number: number,
}