import React, { useState } from "react";
import { FiUsers, FiLock, FiUserPlus, FiSearch } from "react-icons/fi";
import { askAuth } from "../../api/contacts/askAuth";
import { authStatus } from "../../api/contacts/authStatus";
import { choose } from "../../api/contacts/choose";
import { find } from "../../api/contacts/find";
import { addPhoneContact } from "../../api/contacts/addPhoneContact";
import { useApiCall } from "../../hooks/useApiCall";
import { StatusMessage } from "../../components/common/StatusMessage";

export const ContactsPage: React.FC = () => {
  const [authResult, setAuthResult] = useState<string>("");
  const [statusResult, setStatusResult] = useState<string>("");
  const [chosenContact, setChosenContact] = useState<string>("");
  const [searchName, setSearchName] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [foundContacts, setFoundContacts] = useState<string>("");

  // Form state for adding contact
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");

  const askAuthCall = useApiCall();
  const statusCall = useApiCall();
  const chooseCall = useApiCall();
  const findCall = useApiCall();
  const addCall = useApiCall();

  const handleAskAuth = async () => {
    setAuthResult("");
    const result = await askAuthCall.run(() => askAuth(), {
      successMessage: "Authorization request completed",
    });
    if (result) {
      setAuthResult(result.isAuthed === 1 ? "Authorized" : "Not Authorized");
    }
  };

  const handleAuthStatus = async () => {
    setStatusResult("");
    const result = await statusCall.run(() => authStatus(), {
      successMessage: "Authorization status retrieved",
    });
    if (result) {
      const statusMap: Record<number, string> = {
        0: "Not Determined",
        1: "Restricted",
        2: "Denied",
        3: "Authorized",
      };
      setStatusResult(
        `${result.isAuthed ? "Authorized" : "Not Authorized"} (iOS Status: ${
          statusMap[result.status] || result.status
        })`
      );
    }
  };

  const handleChoose = async () => {
    setChosenContact("");
    const result = await chooseCall.run(() => choose(), {
      successMessage: "Contact selected successfully",
    });
    if (result) {
      setChosenContact(`Name: ${result.name}\nPhone: ${result.phone}`);
    }
  };

  const handleFind = async () => {
    setFoundContacts("");
    const result = await findCall.run(
      () =>
        find({
          filter: {
            name: searchName,
            phone: searchPhone,
          },
        }),
      {
        successMessage: "Search completed",
      }
    );
    if (result) {
      if (result.contacts.length === 0) {
        setFoundContacts("No contacts found");
      } else {
        setFoundContacts(
          result.contacts
            .map((c, i) => `${i + 1}. ${c.name} - ${c.phone}`)
            .join("\n")
        );
      }
    }
  };

  const handleAddContact = async () => {
    if (!lastName || !firstName) {
      addCall.showFeedback("error", "Please enter first name and last name");
      return;
    }
    await addCall.run(
      () =>
        addPhoneContact({
          lastName,
          firstName,
          ...(phone && { mobilePhoneNumber: phone }),
          ...(email && { email }),
          ...(organization && { organization }),
        }),
      {
        successMessage: "Contact added successfully",
      }
    );
  };

  const getStatusBadgeColor = (authorized: boolean) => {
    return authorized
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Address Book</h1>
        <p className="text-gray-600">
          Access and manage device contacts using WVContacts APIs (iOS only)
        </p>
      </div>

      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Most contacts APIs are iOS only. Requires
          contacts permission from device settings.
        </p>
      </div>

      {/* Request Authorization */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
          <FiLock className="mr-2 text-teal-600" />
          Request Contacts Authorization
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Request permission to access device contacts (iOS only)
        </p>

        <button
          onClick={handleAskAuth}
          disabled={askAuthCall.loading}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            askAuthCall.loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-teal-600 hover:bg-teal-700"
          }`}
        >
          Request Authorization
        </button>

        {authResult && (
          <div className="mt-4 p-4 bg-teal-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-teal-900">Result:</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                  authResult === "Authorized"
                )}`}
              >
                {authResult}
              </span>
            </div>
          </div>
        )}

        {askAuthCall.feedback && (
          <div className="mt-4">
            <StatusMessage
              type={askAuthCall.feedback.type}
              message={askAuthCall.feedback.message}
            />
          </div>
        )}
      </div>

      {/* Check Authorization Status */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
          <FiLock className="mr-2 text-indigo-600" />
          Check Authorization Status
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Get current contacts permission status (iOS only)
        </p>

        <button
          onClick={handleAuthStatus}
          disabled={statusCall.loading}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            statusCall.loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          Check Status
        </button>

        {statusResult && (
          <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
            <p className="text-sm text-indigo-900">{statusResult}</p>
          </div>
        )}

        {statusCall.feedback && (
          <div className="mt-4">
            <StatusMessage
              type={statusCall.feedback.type}
              message={statusCall.feedback.message}
            />
          </div>
        )}
      </div>

      {/* Choose Contact */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
          <FiUsers className="mr-2 text-blue-600" />
          Choose Contact
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Open contact picker to select a contact
        </p>

        <button
          onClick={handleChoose}
          disabled={chooseCall.loading}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            chooseCall.loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Choose Contact
        </button>

        {chosenContact && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-xs font-medium text-blue-900 mb-1">
              Selected Contact:
            </p>
            <pre className="text-sm text-blue-800 whitespace-pre-wrap">
              {chosenContact}
            </pre>
          </div>
        )}

        {chooseCall.feedback && (
          <div className="mt-4">
            <StatusMessage
              type={chooseCall.feedback.type}
              message={chooseCall.feedback.message}
            />
          </div>
        )}
      </div>

      {/* Find Contacts */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
          <FiSearch className="mr-2 text-purple-600" />
          Find Contacts
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Search contacts by name or phone number
        </p>

        <input
          type="text"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          placeholder="Search by name (e.g., Jack)"
          className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
        />
        <input
          type="text"
          value={searchPhone}
          onChange={(e) => setSearchPhone(e.target.value)}
          placeholder="Search by phone (e.g., 123456)"
          className="w-full px-4 py-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
        />

        <button
          onClick={handleFind}
          disabled={findCall.loading}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            findCall.loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-purple-600 hover:bg-purple-700"
          }`}
        >
          Search Contacts
        </button>

        {foundContacts && (
          <div className="mt-4 p-4 bg-purple-50 rounded-lg">
            <p className="text-xs font-medium text-purple-900 mb-1">Results:</p>
            <pre className="text-sm text-purple-800 whitespace-pre-wrap">
              {foundContacts}
            </pre>
          </div>
        )}

        {findCall.feedback && (
          <div className="mt-4">
            <StatusMessage
              type={findCall.feedback.type}
              message={findCall.feedback.message}
            />
          </div>
        )}
      </div>

      {/* Add Contact */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
          <FiUserPlus className="mr-2 text-green-600" />
          Add New Contact
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Add a new contact to device address book
        </p>

        <div className="space-y-3 mb-4">
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last Name *"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First Name *"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Mobile Phone Number"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
          <input
            type="text"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder="Organization"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
        </div>

        <button
          onClick={handleAddContact}
          disabled={addCall.loading}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            addCall.loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          Add Contact
        </button>

        {addCall.feedback && (
          <div className="mt-4">
            <StatusMessage
              type={addCall.feedback.type}
              message={addCall.feedback.message}
            />
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">
          About Contacts APIs
        </h2>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVContacts.askAuth
            </code>{" "}
            - Request contacts permission (iOS only)
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVContacts.authStatus
            </code>{" "}
            - Check authorization status (iOS only)
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVContacts.choose
            </code>{" "}
            - Open contact picker
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVContacts.find
            </code>{" "}
            - Search contacts by name/phone
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVContacts.addPhoneContact
            </code>{" "}
            - Add new contact to address book
          </li>
          <li>
            • <strong>iOS Status codes:</strong> 0-Not Determined, 1-Restricted,
            2-Denied, 3-Authorized
          </li>
        </ul>
      </div>
    </div>
  );
};
