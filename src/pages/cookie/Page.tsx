import React, { useState } from "react";
import { FiDatabase } from "react-icons/fi";
import { readCookie } from "../../api/cookie/readCookie";
import { writeCookie } from "../../api/cookie/writeCookie";
import { useApiCall } from "../../hooks/useApiCall";
import { StatusMessage } from "../../components/common/StatusMessage";

export const CookiePage: React.FC = () => {
  const [readUrl, setReadUrl] = useState("http://xxx.com");
  const [cookieData, setCookieData] = useState("");

  const [writeCookieKey, setWriteCookieKey] = useState("cookieValue");
  const [writeDomain, setWriteDomain] = useState("example.viettel.com.vn");
  const [writeMaxAge, setWriteMaxAge] = useState("");
  const [writePath, setWritePath] = useState("/");

  const readCall = useApiCall();
  const writeCall = useApiCall();

  const handleReadCookie = async () => {
    setCookieData("");
    const result = await readCall.run(() => readCookie({ url: readUrl }), {
      successMessage: "Cookie read successfully",
    });

    if (result) {
      setCookieData(JSON.stringify(result.value, null, 2));
    }
  };

  const handleWriteCookie = async () => {
    const params: any = {
      cookieKey: writeCookieKey,
      domain: writeDomain,
      path: writePath || "/",
    };

    if (writeMaxAge) {
      params["max-age"] = writeMaxAge;
    }

    await writeCall.run(() => writeCookie(params), {
      successMessage: "Cookie written successfully",
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cookie</h1>
        <p className="text-gray-600">
          Cookie read and write operations across domains
        </p>
      </div>

      {/* Read Cookie */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
          <FiDatabase className="mr-2 text-blue-600" />
          Read Cookie
        </h2>

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            Read all cookies from a specified URL. Use this to read cookies from
            other domains. For same-domain cookies, use JavaScript.
          </p>
        </div>

        <input
          type="text"
          value={readUrl}
          onChange={(e) => setReadUrl(e.target.value)}
          placeholder="URL to read cookies from"
          className="w-full px-4 py-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />

        <button
          onClick={handleReadCookie}
          disabled={readCall.loading}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            readCall.loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Read Cookie
        </button>

        {cookieData && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs font-medium text-blue-900 mb-1">
              Cookie Data:
            </p>
            <pre className="text-xs text-blue-800 whitespace-pre-wrap max-h-48 overflow-y-auto">
              {cookieData}
            </pre>
          </div>
        )}

        {readCall.feedback && (
          <div className="mt-4">
            <StatusMessage
              type={readCall.feedback.type}
              message={readCall.feedback.message}
            />
          </div>
        )}
      </div>

      {/* Write Cookie */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
          <FiDatabase className="mr-2 text-green-600" />
          Write Cookie
        </h2>

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            Write cookie to a domain. Use this to write cookies to other
            domains. For same-domain cookies, use JavaScript.
          </p>
        </div>

        <div className="space-y-3 mb-4">
          <input
            type="text"
            value={writeCookieKey}
            onChange={(e) => setWriteCookieKey(e.target.value)}
            placeholder="Cookie key=value"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
          <input
            type="text"
            value={writeDomain}
            onChange={(e) => setWriteDomain(e.target.value)}
            placeholder="Domain (e.g., example.viettel.com.vn)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
          <input
            type="text"
            value={writeMaxAge}
            onChange={(e) => setWriteMaxAge(e.target.value)}
            placeholder="Max age (optional, in seconds)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
          <input
            type="text"
            value={writePath}
            onChange={(e) => setWritePath(e.target.value)}
            placeholder="Path (default: /)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
        </div>

        <button
          onClick={handleWriteCookie}
          disabled={writeCall.loading}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            writeCall.loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          Write Cookie
        </button>

        {writeCall.feedback && (
          <div className="mt-4">
            <StatusMessage
              type={writeCall.feedback.type}
              message={writeCall.feedback.message}
            />
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">
          About Cookie APIs
        </h2>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVCookie.read
            </code>{" "}
            - Read all cookies from a specified URL
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVCookie.write
            </code>{" "}
            - Write cookie to a specified domain
          </li>
          <li>
            • Use JavaScript for same-domain cookie operations (faster and
            simpler)
          </li>
          <li>
            • Use these APIs when you need cross-domain cookie access or
            management
          </li>
        </ul>
      </div>
    </div>
  );
};
