#!/bin/bash

USERNAME=$1
REPOSITORY_NAME=$2
USER_EMAIL=$3

# Controllo dei parametri in ingresso
if [ -z "$USERNAME" ] || [ -z "$REPOSITORY_NAME" ] || [ -z "$USER_EMAIL" ]; then
   echo "Some or all of the parameters are empty"
   echo "This script expects 3 parameters: ./git_init.sh username repository_name user_email"
   exit 1
fi

# Controllo della validità dell'indirizzo email
if ! [[ "$USER_EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$ ]]; then
   echo "Email address $USER_EMAIL is invalid, exiting..."
   exit 1
fi

# Controllo se il repository è già stato inizializzato
if [ -d ".git" ]; then
   echo "Repository is already initialized, exiting..."
   exit 1
fi

# Inizializzazione del repository Git
git init
git checkout -b main
echo "Repository initialized!"

# Configurazione del repository Git locale
if [ -z "$(git config --get user.name)" ]; then
   git config --local user.name "$USERNAME"
fi

if [ -z "$(git config --get user.email)" ]; then
   git config --local user.email "$USER_EMAIL"
fi

# Aggiunta del repository remoto
if ! git remote | grep -q "origin"; then
   if git remote add origin "git@github.com:$USERNAME/$REPOSITORY_NAME" && git remote set-url origin "git@github.com:$USERNAME/$REPOSITORY_NAME"; then
      echo "Remote origin added with remote url."
   else 
      echo "Something went wrong while adding remote origin, exiting..."
      exit 1
   fi
fi


echo "Git repository configured correctly!"
