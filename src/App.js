
import React, { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:8080/api/listings";

const blank = {
  donorName: "",
  foodItem: "",
  quantityServings: "",
  shelfLifeHours: "",
  location: ""
};

export default function App() {
  const [form, setForm] = useState(blank);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Load donations from backend
  const load = async () => {
    try {
      const response = await fetch(API);

      if (!response.ok) {
        throw new Error("Unable to load donations.");
      }

      const data = await response.json();
      setRows(data);
      setError("");
    } catch (err) {
      setError(
        "Cannot connect to backend. Check Spring Boot on port 8080."
      );
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  // Add new food donation
  const add = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (
      !form.donorName.trim() ||
      !form.foodItem.trim() ||
      !form.location.trim() ||
      !form.shelfLifeHours.trim() ||
      Number(form.quantityServings) < 1
    ) {
      setError("Please fill all fields correctly.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...form,
          quantityServings: Number(form.quantityServings)
        })
      });

      if (!response.ok) {
        throw new Error(
          "Unable to add donation. HTTP " + response.status
        );
      }

      setForm({ ...blank });
      setSuccess("Food donation added successfully!");

      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update or delete donation
  const request = async (url, options) => {
    setError("");
    setSuccess("");

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(
          "Operation failed. HTTP " + response.status
        );
      }

      setSuccess("Donation updated successfully!");
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main>
      <header>
        <span>♻ FOOD RESCUE</span>
        <h1>Smart Food Rescue & Redistribution</h1>
        <p>
          Share surplus food. Reduce waste.
          Support your community.
        </p>
      </header>

      <section className="stats">
        <div>
          <strong>{rows.length}</strong>
          <span>Total Donations</span>
        </div>

        <div>
          <strong>
            {rows.filter((x) => x.status === "AVAILABLE").length}
          </strong>
          <span>Available</span>
        </div>

        <div>
          <strong>
            {rows.filter((x) => x.status === "DELIVERED").length}
          </strong>
          <span>Delivered</span>
        </div>
      </section>

      <section className="panel">
        <h2>Post a Food Donation</h2>

        <form onSubmit={add}>
          <label>
            Donor / Restaurant
            <input
              type="text"
              name="donorName"
              value={form.donorName}
              onChange={handleChange}
              placeholder="Enter donor name"
              required
            />
          </label>

          <label>
            Food Item
            <input
              type="text"
              name="foodItem"
              value={form.foodItem}
              onChange={handleChange}
              placeholder="Enter food item"
              required
            />
          </label>

          <label>
            Quantity (Servings)
            <input
              type="number"
              name="quantityServings"
              value={form.quantityServings}
              onChange={handleChange}
              placeholder="Enter quantity"
              min="1"
              required
            />
          </label>

          <label>
            Shelf Life
            <input
              type="text"
              name="shelfLifeHours"
              value={form.shelfLifeHours}
              onChange={handleChange}
              placeholder="e.g. 5 hours"
              required
            />
          </label>

          <label>
            Pickup Location
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Enter location"
              required
            />
          </label>

          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? "Adding..." : "+ Add Food Listing"}
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        {success && (
          <p className="success">{success}</p>
        )}
      </section>

      <section className="panel">
        <h2>Donation Listings</h2>

        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Donor</th>
                <th>Food</th>
                <th>Servings</th>
                <th>Shelf Life</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    No donations yet. Add the first one above!
                  </td>
                </tr>
              ) : (
                rows.map((item) => (
                  <tr key={item.id}>
                    <td>{item.donorName}</td>
                    <td>{item.foodItem}</td>
                    <td>{item.quantityServings}</td>
                    <td>{item.shelfLifeHours}</td>
                    <td>{item.location}</td>

                    <td>
                      <span className={"tag " + item.status}>
                        {item.status}
                      </span>
                    </td>

                    <td>
                      {item.status !== "DELIVERED" && (
                        <button
                          type="button"
                          className="action"
                          onClick={() =>
                            request(API + "/" + item.id, {
                              method: "PUT"
                            })
                          }
                        >
                          {item.status === "AVAILABLE"
                            ? "Claim"
                            : "Deliver"}
                        </button>
                      )}

                      <button
                        type="button"
                        className="danger"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Delete this donation?"
                            )
                          ) {
                            request(API + "/" + item.id, {
                              method: "DELETE"
                            });
                          }
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <footer>
        Demo project · Only list food that is safe
        to share and follow local food-safety guidance.
      </footer>
    </main>
  );
}

