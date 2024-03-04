export interface Card {
    id: number;
    name: string;
    description: string; 
    attack_points: number;
    is_synchro: boolean;
    release_date: string;
    image_url: string;
    type: string;
    abilities: string[];
    stats: {
        id: number;
        rank: string;
        popularity: string;
    };
}

export interface Character {
    id: number;
    name: string;
    image: string;
    favorite_card_id: number;
    deck_theme: string;
    signature_move: string;
}