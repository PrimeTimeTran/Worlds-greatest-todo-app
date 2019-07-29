import React from "react";

const SignInForm = props => (
  <div className="SignInFormNavigation">
    <input
      value={props.email}
      className="NavigationInput"
      onChange={e => {
        props.setEmail(e.target.value);
      }}
    />
    <input
      type="password"
      value={props.password}
      className="NavigationInput"
      onChange={e => {
        props.setPassword(e.target.value);
      }}
    />
    <button className="Btn Btn-Signin" onClick={props.onSignIn}>
      Signin
    </button>
  </div>
);

export default SignInForm;
