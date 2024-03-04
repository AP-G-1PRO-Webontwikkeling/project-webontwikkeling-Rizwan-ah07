import readline from 'readline-sync';
import { Card, Character } from './interfaces';

async function Main() {
    try {
        const cardsResponse = await fetch('https://raw.githubusercontent.com/AP-G-1PRO-Webontwikkeling/project-webontwikkeling-Rizwan-ah07/main/JSON/cards.json');
        const charactersResponse = await fetch('https://raw.githubusercontent.com/AP-G-1PRO-Webontwikkeling/project-webontwikkeling-Rizwan-ah07/main/JSON/characters.json');
        const cards: Card[] = await cardsResponse.json();
        const characters: Character[] = await charactersResponse.json();
        let exitLoop = false;

        do {
            console.log("1: View all cards");
            console.log("2: View all characters");
            console.log("3: Filter cards by type");
            console.log("4: Exit");
            let input: string = readline.question("What option do you pick: ");
            switch (input) {
                case "1":
                    cards.forEach(card => {
                        console.log(`Name: ${card.name}, ID: ${card.id}, Type: ${card.type}`);
                    });
                    break;
                case "2":
                    characters.forEach(character => {
                        console.log(`Name: ${character.name}, ID: ${character.id}}`);
                    });
                    break;
                    case "3":
                        let typeInput: string = readline.question("Enter card type to filter by: ").toLowerCase();
                        const filteredCards = cards.filter(card => card.type.toLowerCase().includes(typeInput));
                        if (filteredCards.length === 0) {
                            console.log("Error: There are no cards of the specified type.");
                        } else {
                            filteredCards.forEach(card => {
                                console.log(`Name: ${card.name}, ID: ${card.id}, Type: ${card.type}`);
                            });
                        }
                        break;
                case "4":
                    exitLoop = true;
                    break;
                default:
                    console.log("Invalid input, please try again.");
            }
        } while (!exitLoop);
    } catch (error: any) {
        console.log(error);
    }
};

Main();

export {}