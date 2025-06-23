#!/bin/bash
if [ -z "$LANG_CHOSEN" ]; then
  echo "\nChoose your language / Choisissez votre langue :"
  echo "1) English (default)"
  echo "2) Français"
  read -t 15 -p "[1/2]: " lang_choice
  if [[ "$lang_choice" == "2" ]]; then
    export LANG=fr_FR.UTF-8
    echo "LANG=fr_FR.UTF-8" > ~/.config/user-locale.conf
    echo "\nLangue française activée."
  else
    export LANG=en_US.UTF-8
    echo "LANG=en_US.UTF-8" > ~/.config/user-locale.conf
    echo "\nEnglish language active."
  fi
  export LANG_CHOSEN=1
fi
