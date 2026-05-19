import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditProfileModal } from "../EditProfileModal";
import type { AuthUser } from "../../services/authService";

const { updateProfile, changePassword, toastSuccess, toastError } = vi.hoisted(() => ({
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("../../services/authService", () => ({
  updateProfile,
  changePassword,
}));

vi.mock("../Toast", () => ({
  toast: {
    success: toastSuccess,
    error: toastError,
  },
}));

const user: AuthUser = {
  id: 1,
  employee_code: "EMP001",
  full_name: "Old Name",
  department: "IT",
  role: "user",
  email: "old@example.com",
  email_2: null,
  phone: "0811111111",
};

function renderModal() {
  const onClose = vi.fn();
  const onUpdateUser = vi.fn();
  render(<EditProfileModal user={user} onClose={onClose} onUpdateUser={onUpdateUser} />);
  return { onClose, onUpdateUser };
}

function profileSubmitButton() {
  return screen.getAllByRole("button").at(-1) as HTMLButtonElement;
}

async function openPasswordTab() {
  await userEvent.click(screen.getByRole("button", { name: "เปลี่ยนรหัสผ่าน" }));
}

describe("EditProfileModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateProfile.mockResolvedValue({ ...user, full_name: "New Name", email: "new@example.com" });
    changePassword.mockResolvedValue({ message: "Password changed" });
  });

  it("updates profile with trimmed values and closes on success", async () => {
    const { onClose, onUpdateUser } = renderModal();
    const inputs = screen.getAllByRole("textbox");

    await userEvent.clear(inputs[0]);
    await userEvent.type(inputs[0], "  New Name  ");
    await userEvent.clear(inputs[1]);
    await userEvent.type(inputs[1], "new@example.com");
    await userEvent.clear(inputs[3]);
    await userEvent.type(inputs[3], "0822222222");
    await userEvent.click(profileSubmitButton());

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith({
        full_name: "New Name",
        email: "new@example.com",
        email_2: null,
        phone: "0822222222",
      });
      expect(onUpdateUser).toHaveBeenCalledWith(expect.objectContaining({ full_name: "New Name" }));
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(toastSuccess).toHaveBeenCalled();
    });
  });

  it("does not call API when the browser blocks an invalid email submit", async () => {
    renderModal();
    const inputs = screen.getAllByRole("textbox");

    await userEvent.clear(inputs[1]);
    await userEvent.type(inputs[1], "bad-email");
    await userEvent.click(profileSubmitButton());

    expect(updateProfile).not.toHaveBeenCalled();
  });

  it("does not change password when confirmation does not match", async () => {
    renderModal();

    await openPasswordTab();
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    await userEvent.type(passwordInputs[0], "old-pass");
    await userEvent.type(passwordInputs[1], "new-pass");
    await userEvent.type(passwordInputs[2], "different");
    await userEvent.click(profileSubmitButton());

    expect(changePassword).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalled();
  });

  it("changes password and closes on success", async () => {
    const { onClose } = renderModal();

    await openPasswordTab();
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    await userEvent.type(passwordInputs[0], "old-pass");
    await userEvent.type(passwordInputs[1], "new-pass");
    await userEvent.type(passwordInputs[2], "new-pass");
    await userEvent.click(profileSubmitButton());

    await waitFor(() => {
      expect(changePassword).toHaveBeenCalledWith({ old_password: "old-pass", new_password: "new-pass" });
      expect(toastSuccess).toHaveBeenCalledWith("Password changed");
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
