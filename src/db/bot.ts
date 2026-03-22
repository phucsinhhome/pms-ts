import { AxiosInstance } from 'axios';
import { botApi } from './apis';

export const registerBot = async (botId: string, botToken: string): Promise<any> => {
    try {
        const response = await botApi.post('/register', {
            botId,
            botToken
        });
        return response.data;
    } catch (error) {
        console.error('Error registering bot:', error);
        throw error; // Re-throw to allow calling component to handle it
    }
};
