FROM alpine:3.22.0
RUN apk add --no-cache curl git nodejs npm
WORKDIR /app1
RUN <<EOF
npm i argon2 busboy mime-types pg
curl https://raw.githubusercontent.com/google/material-design-icons/bb04090/variablefont/MaterialSymbolsSharp%5BFILL%2CGRAD%2Copsz%2Cwght%5D.woff2 >ms.woff2
EOF
WORKDIR /app
RUN npm i clean-css html-minifier postcss postcss-import rollup terser
RUN mkdir build
COPY concept concept
COPY make make
COPY manifest manifest
COPY root root
COPY sw sw
RUN <<EOF
node make/main.mjs
EOF
FROM alpine:3.22.0
RUN apk add --no-cache nodejs
WORKDIR /app
COPY --from=0 /app1/ms.woff2 build/ms.woff2
COPY --from=0 /app1/node_modules node_modules
COPY favicon favicon
COPY app/app app
COPY --from=0 /app/build build
CMD ["node","app/main.mjs"]
