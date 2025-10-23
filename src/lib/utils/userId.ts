import User from '$lib/models/User';
import connectDB from '$lib/database/connection';

export async function generateUserId(): Promise<number> {
    try {
        await connectDB();

        // Find the user with the highest userId
        const lastUser = await User.findOne().sort({ userId: -1 });

        if (lastUser && lastUser.userId) {
            return lastUser.userId + 1;
        } else {
            // Start from 2431 if no users exist
            return 2431;
        }
    } catch (error) {
        console.error('Error generating userId:', error);
        // Fallback to a random number starting from 2431
        return 2431 + Math.floor(Math.random() * 1000);
    }
}
