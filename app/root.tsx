import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";

import {
  Form,
  Link,
  Links,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
  json,
  redirect,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";

// スタイルシートのURLを取得
import appStylesHref from "./app.css?url";
import { createEmptyContact, getContacts } from "./data";
import { useEffect, useState } from "react";

// スタイルシートの読み込み
export const links: LinksFunction = () => [
  { rel: "stylesheet", href: appStylesHref },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const contacts = await getContacts(q);
  return json({ contacts, q });
};

export const action = async () => {
  const contact = await createEmptyContact();
  return redirect(`/contacts/${contact.id}/edit`);
};

export default function App() {
  // ルートに対応するloader関数で得たデータにアクセス
  // useLoaderDataで得られるデータの型はloader関数の戻り値の型であるとアノテーション
  const { contacts, q } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const [query, setQuery] = useState(q || "");
  const submit = useSubmit();

  // 現在のロケーションについて、URLのクエリ文字列にqが存在するかを判定
  // 現在検索中かどうかの判定に使う
  const searching =
    navigation.location && // 現在のナビゲーションのロケーション情報を取得（現在のページのURLの情報）
    new URLSearchParams(navigation.location.search).has("q"); // URLのクエリ文字列を解析するクラス

  useEffect(() => {
    setQuery(q || "");
  }, [q]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        {/* リンクタグをレンダリング */}
        <Links />
      </head>
      <body>
        <div id="sidebar">
          <h1>Remix Contacts</h1>
          <div>
            <Form
              id="search-form"
              role="search"
              onChange={(event) => submit(event.currentTarget)}
            >
              <input
                id="q"
                className={searching ? "loading" : ""}
                onChange={(event) => setQuery(event.currentTarget.value)}
                aria-label="Search contacts"
                placeholder="Search"
                type="search"
                name="q"
                value={query}
              />
              <div id="search-spinner" aria-hidden hidden={!searching} />
            </Form>
            {/* フォームはブラウザがリクエストをサーバーに送るのを防ぐ */}
            {/* 代わりにfetchを使いルートのアクション関数にリクエストを送る */}
            <Form method="post">
              <button type="submit">New</button>
            </Form>
          </div>
          <nav>
            {contacts.length ? (
              <ul>
                {contacts.map((contact) => (
                  <li key={contact.id}>
                    <NavLink
                      className={({ isActive, isPending }) =>
                        isActive ? "active" : isPending ? "pending" : ""
                      }
                      to={`contacts/${contact.id}`}
                    >
                      {contact.first || contact.last ? (
                        <>
                          {contact.first} {contact.last}
                        </>
                      ) : (
                        <i>No Name</i>
                      )}{" "}
                      {contact.favorite ? <span>★</span> : null}
                    </NavLink>
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                <i>No contacts</i>
              </p>
            )}
          </nav>
        </div>
        <div
          // 検索時は画面がフェードアウトしないようにする
          className={
            navigation.state === "loading" && !searching ? "loading" : ""
          }
          id="detail"
        >
          <Outlet />
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
