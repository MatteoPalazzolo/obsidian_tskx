
export interface SecretSettings {
    spotify: {
        clientId: string, 
        secretId: string    
    }
};

export interface LinkProcessorSettings {
    templateFilePath: string,
    destinationFolder: string
}
