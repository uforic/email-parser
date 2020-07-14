#!/bin/bash

cd backend/
yarn install
yarn build
cd ..
cd frontend
yarn install
yarn build
cd ..

rm -rf dist
mkdir dist
cp -r frontend/build dist/frontend
cp -r backend/dist dist/backend
