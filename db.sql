/*
 Navicat Premium Data Transfer

 Source Server         : AWS NS1 (PostgreSQL)
 Source Server Type    : PostgreSQL
 Source Server Version : 90111
 Source Host           : localhost
 Source Database       : dogeify
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 90111
 File Encoding         : utf-8

 Date: 02/17/2014 03:28:37 AM
*/

-- ----------------------------
--  Sequence structure for "payments_id_seq"
-- ----------------------------
DROP SEQUENCE IF EXISTS "payments_id_seq";
CREATE SEQUENCE "payments_id_seq" INCREMENT 1 START 26 MAXVALUE 9223372036854775807 MINVALUE 1 CACHE 1;
ALTER TABLE "payments_id_seq" OWNER TO "dogeify";

-- ----------------------------
--  Sequence structure for "sites_id_seq"
-- ----------------------------
DROP SEQUENCE IF EXISTS "sites_id_seq";
CREATE SEQUENCE "sites_id_seq" INCREMENT 1 START 67 MAXVALUE 9223372036854775807 MINVALUE 1 CACHE 1;
ALTER TABLE "sites_id_seq" OWNER TO "dogeify";

-- ----------------------------
--  Sequence structure for "users_id_seq"
-- ----------------------------
DROP SEQUENCE IF EXISTS "users_id_seq";
CREATE SEQUENCE "users_id_seq" INCREMENT 1 START 30 MAXVALUE 9223372036854775807 MINVALUE 1 CACHE 1;
ALTER TABLE "users_id_seq" OWNER TO "dogeify";

-- ----------------------------
--  Table structure for "payments"
-- ----------------------------
DROP TABLE IF EXISTS "payments";
CREATE TABLE "payments" (
	"id" int4 NOT NULL DEFAULT nextval('payments_id_seq'::regclass),
	"user_id" int4 NOT NULL,
	"amount" int4 NOT NULL,
	"address" varchar(200) NOT NULL,
	"type" varchar(30) NOT NULL,
	"status" int4 NOT NULL DEFAULT 1,
	"updated_at" timestamp(6) NULL,
	"transaction_hash" varchar(100)
)
WITH (OIDS=FALSE);
ALTER TABLE "payments" OWNER TO "dogeify";

-- ----------------------------
--  Table structure for "users"
-- ----------------------------
DROP TABLE IF EXISTS "users";
CREATE TABLE "users" (
	"id" int4 NOT NULL DEFAULT nextval('users_id_seq'::regclass),
	"refers" int4 DEFAULT 0,
	"referrer" text,
	"twitter_username" varchar(200),
	"dogecoin_address" varchar(200),
	"points" int4 NOT NULL DEFAULT 0,
	"has_tweeted" bool NOT NULL DEFAULT false
)
WITH (OIDS=FALSE);
ALTER TABLE "users" OWNER TO "dogeify";

-- ----------------------------
--  Table structure for "sites"
-- ----------------------------
DROP TABLE IF EXISTS "sites";
CREATE TABLE "sites" (
	"id" int4 NOT NULL DEFAULT nextval('sites_id_seq'::regclass),
	"url" varchar(200) NOT NULL,
	"searches" int4 NOT NULL DEFAULT 1,
	"comment" varchar(200)
)
WITH (OIDS=FALSE);
ALTER TABLE "sites" OWNER TO "dogeify";

