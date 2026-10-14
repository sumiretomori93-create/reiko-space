import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import assert from "node:assert/strict";
const path=process.argv[2];if(!path)throw new Error("Usage: node scripts/verify-backup.mjs <private-backup.json>");
const raw=readFileSync(path),data=JSON.parse(raw);assert.equal(data.version,1);
for(const key of ["posts","comments","nightRecords"])assert(Array.isArray(data[key]),key);
const db=new DatabaseSync(":memory:");
try {
 db.exec("PRAGMA foreign_keys=ON; CREATE TABLE posts(id INTEGER PRIMARY KEY,content TEXT NOT NULL,created_at TEXT NOT NULL); CREATE TABLE comments(id INTEGER PRIMARY KEY,post_id INTEGER NOT NULL REFERENCES posts(id),content TEXT NOT NULL,created_at TEXT NOT NULL); CREATE TABLE records(id INTEGER PRIMARY KEY,score INTEGER NOT NULL,updated_at TEXT);");
 const checkId=n=>assert(Number.isSafeInteger(n)&&n>0);
 const checkText=s=>assert(typeof s==="string"&&s.length>0&&s.length<=500);
 const checkDate=s=>assert(typeof s==="string"&&!Number.isNaN(Date.parse(s)));
 for(const p of data.posts){checkId(p.id);checkText(p.content);checkDate(p.createdAt);db.prepare("INSERT INTO posts VALUES(?,?,?)").run(p.id,p.content,p.createdAt);}
 for(const c of data.comments){checkId(c.id);checkId(c.postId);checkText(c.content);checkDate(c.createdAt);db.prepare("INSERT INTO comments VALUES(?,?,?,?)").run(c.id,c.postId,c.content,c.createdAt);}
 for(const r of data.nightRecords){assert.equal(r.id,1);assert(Number.isSafeInteger(r.score)&&r.score>=0&&r.score%4===0);if(r.updatedAt!==undefined)checkDate(r.updatedAt);db.prepare("INSERT INTO records VALUES(?,?,?)").run(r.id,r.score,r.updatedAt??null);}
 for(const [name,rows]of [["posts",data.posts],["comments",data.comments],["records",data.nightRecords]])assert.equal(db.prepare(`SELECT count(*) AS n FROM ${name}`).get().n,rows.length);
 for(const p of data.posts)assert.equal(db.prepare("SELECT content FROM posts WHERE id=?").get(p.id).content,p.content);
 for(const c of data.comments)assert.equal(db.prepare("SELECT content FROM comments WHERE id=?").get(c.id).content,c.content);
 console.log(JSON.stringify({verified:true,posts:data.posts.length,comments:data.comments.length,records:data.nightRecords.length,sha256:createHash('sha256').update(raw).digest('hex')}));
} finally {db.close();}
