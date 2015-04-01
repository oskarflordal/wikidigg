//  Copyright 2013 Google Inc. All Rights Reserved.
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.

#include <iostream>

#include <bsoncxx/builder/stream/document.hpp>
#include <bsoncxx/json.hpp>

#include <mongocxx/client.hpp>
#include <mongocxx/instance.hpp>
#include <string>

#include <cstdio>
#include <cstring>
#include <cmath>
#include <malloc.h>

using bsoncxx::builder::stream::document;
using bsoncxx::builder::stream::finalize;
using bsoncxx::builder::stream::open_array;
using bsoncxx::builder::stream::close_array;

const long long max_size = 2000;         // max length of strings
const long long N = 20;                  // number of closest words that will be shown
const long long max_w = 50;              // max length of vocabulary entries

float *M;
char *vocab;

FILE *f;
char st1[max_size];
long long bestw[N];
char file_name[max_size], st[100][max_size];
float dist, len, bestd[N], vec[max_size];
long long words, size, a, b, c, d, cn, bi[100];
char ch;


void findSimilar() {

  for (a = 0; a < N; a++) {
    bestw[a] = 0;
    bestd[a] = -1;
  }
  
  for (c = 0; c < words; c++) {
    a = 0;

    dist = 0;

    for (a = 0; a < size; a++) {
      dist += vec[a] * M[a + c * size];
    }

    for (a = 0; a < N; a++) {
      if (dist > bestd[a]) {
	for (d = N - 1; d > a; d--) {
	  bestd[d] = bestd[d - 1];
	  bestw[d] = bestw[d - 1];
	}
	bestd[a] = dist;
	bestw[a] = c;
	break;
      }
    }
  }
}


int main(int argc, char** argv) {
    mongocxx::instance inst{};
    mongocxx::client mongo_client(mongocxx::uri("mongodb://127.0.0.1:3001"));

    auto collection = mongo_client["meteor"]["wordvec"];

    // distance.c
    if (argc < 2) {
      printf("Usage: ./distance <FILE>\nwhere FILE contains word projections in the BINARY FORMAT\n");
      return 0;
    }
    strcpy(file_name, argv[1]);
    f = fopen(file_name, "rb");
    if (f == NULL) {
      printf("Input file not found\n");
      return -1;
    }
    fscanf(f, "%lld", &words);
    fscanf(f, "%lld", &size);
    vocab = (char *)malloc((long long)words * max_w * sizeof(char));
    M = (float *)malloc((long long)words * (long long)size * sizeof(float));
    if (M == NULL) {
      printf("Cannot allocate memory: %lld MB    %lld  %lld\n", (long long)words * size * sizeof(float) / 1048576, words, size);
      return -1;
    }
    for (b = 0; b < words; b++) {
      a = 0;
      while (1) {
	vocab[b * max_w + a] = fgetc(f);
	if (feof(f) || (vocab[b * max_w + a] == ' ')) break;
	if ((a < max_w) && (vocab[b * max_w + a] != '\n')) a++;
      }
      vocab[b * max_w + a] = 0;
      for (a = 0; a < size; a++) fread(&M[a + b * size], sizeof(float), 1, f);
      len = 0;
      for (a = 0; a < size; a++) len += M[a + b * size] * M[a + b * size];
      len = sqrt(len);
      for (a = 0; a < size; a++) M[a + b * size] /= len;
    }
    fclose(f);

    // go through each word
    for (int i = 0 ; i < words; ++i) {
      // find the most similar
      b = i;

      for (a = 0; a < size; a++) vec[a] += M[a + b * size];
      len = 0;
      for (a = 0; a < size; a++) len += vec[a] * vec[a];
      len = sqrt(len);
      for (a = 0; a < size; a++) vec[a] /= len;

      findSimilar();

      auto doc = document{} << "id" << i << "word" << std::string(&vocab[i*max_w]) << "simid" << open_array <<
				 (int)bestw[1] << 
				 (int)bestw[2] << 
				 (int)bestw[3] << 
				 (int)bestw[4] << 
				 (int)bestw[5] << 
				 (int)bestw[6] << 
				 (int)bestw[7] << 
				 (int)bestw[8] << 
				 (int)bestw[9] << 
				 (int)bestw[10] << 
				 close_array <<
				 finalize;
      collection.insert_one(doc);

      printf("%s : %d: %50s %d: %50s %d: %50s\n", &vocab[i*max_w], bestw[0], &vocab[bestw[0]*max_w], bestw[1], &vocab[bestw[1]*max_w], bestw[2], &vocab[bestw[2]*max_w]);
    }



    auto cursor = collection.find({});

    for (auto&& doc : cursor) {
        std::cout << bsoncxx::to_json(doc) << std::endl;
    }
}
