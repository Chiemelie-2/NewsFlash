from openai import OpenAI 

import tweepy #Twitter 


import requests #Facebook

client = OpenAI()

def generate_social_post(headline, url):
    prompt = f"""
    Write a short engaging social media post for this news headline.

    Headline: {headline}
    Link: {url}

    Include 2 hashtags.
    """

    res = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[{"role": "user", "content": prompt}]
    )

    return res.choices[0].message.content

#Twitter automated posting

client = tweepy.Client(
    consumer_key="KEY",
    consumer_secret="SECRET",
    access_token="TOKEN",
    access_token_secret="TOKEN_SECRET"
)

def post_to_twitter(message):
    client.create_tweet(text=message)


#Facebook Automated posting

PAGE_ID = "your_page_id"
PAGE_ACCESS_TOKEN = "your_page_access_token"

def post_to_facebook(message, link):

    url = f"https://graph.facebook.com/{PAGE_ID}/feed"

    payload = {
        "message": message,
        "link": link,
        "access_token": PAGE_ACCESS_TOKEN
    }

    response = requests.post(url, data=payload)

    print(response.json())

def create_facebook_post(headline, url):

    return f"""
{headline}

Read the full story:
{url}

#TechNews #AI
"""

#Trigger for X automate posting:

message = generate_social_post(article["headline"], article["source_url"])

post_to_twitter(message)


#Trigger for Facebook automate posting:

message = create_facebook_post(article["headline"], article["url"])

post_to_facebook(message, article["url"])