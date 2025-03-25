// lib/twitter-service.ts
import axios from 'axios';

export interface Tweet {
  id: string;
  text: string;
  created_at: string;
}

export class TwitterService {
  private bearerToken: string;
  
  constructor() {
    this.bearerToken = process.env.TWITTER_BEARER_TOKEN || '';
    
    if (!this.bearerToken) {
      console.warn('Twitter bearer token not found. Twitter analysis will not work.');
    }
  }
  
  async getUserTweets(username: string, count: number = 50): Promise<Tweet[]> {
    if (!this.bearerToken) {
      throw new Error('Twitter bearer token not configured');
    }
    
    try {
      // First get the user ID
      const userResponse = await axios.get(
        `https://api.twitter.com/2/users/by/username/${username}`,
        {
          headers: {
            Authorization: `Bearer ${this.bearerToken}`
          }
        }
      );
      
      if (!userResponse.data.data?.id) {
        throw new Error('Twitter user not found');
      }
      
      const userId = userResponse.data.data.id;
      
      // Then get their tweets
      const tweetsResponse = await axios.get(
        `https://api.twitter.com/2/users/${userId}/tweets`,
        {
          headers: {
            Authorization: `Bearer ${this.bearerToken}`
          },
          params: {
            max_results: count,
            'tweet.fields': 'created_at',
            exclude: 'retweets,replies'
          }
        }
      );
      
      return tweetsResponse.data.data || [];
    } catch (error) {
      console.error('Error fetching tweets:', error);
      throw error;
    }
  }
}