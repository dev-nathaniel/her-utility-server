import { Expo } from 'expo-server-sdk';
const expo = new Expo();

interface SendPushNotificationOptions {
    tokens: string[];
    title: string;
    subtitle: string;
    message: string;
}

export async function sendPushNotification(options: SendPushNotificationOptions): Promise<void> {  
    
    const chunks = expo.chunkPushNotifications(options.tokens.map(t => ({
        to: t,
        title: options.title,
        subtitle: options.subtitle,
        sound: "default",
        body: options.message,
        icon: "https://www.breakthrough-family-server.onrender.com/ic_icon.png",
      })));
  
      // console.log(chunks);
      for (const chunk of chunks) {
        const tickets = await expo.sendPushNotificationsAsync(chunk);
        // console.log(tickets);
      }
}