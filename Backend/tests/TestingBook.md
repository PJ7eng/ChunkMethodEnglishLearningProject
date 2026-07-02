# Testing Book
This is an recording note for testing.

## 2026/07/02

1. Get chunks Testing
    API: chunks

    Situation: Get chunks
    Result: return phrase, translation, examples and options

2. Get chunks randomly Testing
    API: chunks/random

    Situation: Get random chunks
    Result: return phrase, translation, examples and options

## 2026/07/01

1. Register Testing
    API: auth/register

    Situation: First register email
    Result: Register successful, user has been recorded in database

    Situation: Registration with existing email
    Result: Conflict, code 409

2. Login Testing
    API: auth/login

    Situation: Right account info
    Result: Login successful, return an JWT token

    Situation: Wrong account info
    Result: Unauthorized, code 401

3. AuthGuard Testing
    API: auth/me

    Situation: Right JWT token
    Result: Authenticated user profile, return current user profile

    Situation: Wrong JWT token
    Result: Unauthorized, code 401
