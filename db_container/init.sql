
CREATE TABLE "users" (
  "id" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "name" varchar NOT NULL,
  "image" varchar,
  "win" int DEFAULT 0,
  "lose" int DEFAULT 0
);

CREATE TABLE "friendship" (
  "id" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "user_id" bigint NOT NULL,
  "friend_id" bigint NOT NULL,
  "created_at" timestamp NOT NULL
);

CREATE TABLE "blocked_user" (
  "id" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "blocker_id" bigint NOT NULL,
  "blocked_user_id" bigint NOT NULL
);

CREATE TABLE "team" (
  "id" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "name" varchar NOT NULL,
  "game_id" bigint NOT NULL
);

CREATE TABLE "team_users" (
  "id" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "team_id" int NOT NULL,
  "user_id" int NOT NULL
);

CREATE TABLE "game" (
  "id" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "start_at" timestamp NOT NULL,
  "end_at" timestamp
);

CREATE TABLE "round" (
  "id" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "game_id" bigint NOT NULL,
  "win_team_id" bigint NOT NULL
);

CREATE TABLE "message" (
  "id" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "sender_id" bigint NOT NULL,
  "receiver_id" bigint NOT NULL,
  "content" text NOT NULL,
  "send_date" timestamp NOT NULL
);

ALTER TABLE "blocked_user" ADD FOREIGN KEY ("blocker_id") REFERENCES "users" ("id");

ALTER TABLE "blocked_user" ADD FOREIGN KEY ("blocked_user_id") REFERENCES "users" ("id");

ALTER TABLE "team_users" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "friendship" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "friendship" ADD FOREIGN KEY ("friend_id") REFERENCES "users" ("id");

ALTER TABLE "team_users" ADD FOREIGN KEY ("team_id") REFERENCES "team" ("id");

ALTER TABLE "round" ADD FOREIGN KEY ("win_team_id") REFERENCES "team" ("id");

ALTER TABLE "team" ADD FOREIGN KEY ("game_id") REFERENCES "game" ("id");

ALTER TABLE "round" ADD FOREIGN KEY ("game_id") REFERENCES "game" ("id");

ALTER TABLE "message" ADD FOREIGN KEY ("sender_id") REFERENCES "users" ("id");

ALTER TABLE "message" ADD FOREIGN KEY ("receiver_id") REFERENCES "users" ("id");