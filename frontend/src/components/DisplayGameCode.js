import React, { useRef, useState } from "react";

export const DisplayGameCode = ({ gameID }) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const textInputRef = useRef(null);
  const copyToClipboard = (e) => {
    // textInputRef.current.select();
    // document.execCommand("copy");
    // setCopySuccess(true);
  };
  return (
    <div>
      <div className="row my-3 text-center">
        <div className="col-sm"></div>
        <div className="col-sm=8">
          <h4>Send this Code to your friends to join them in the game</h4>
          <div className="input-group mb-3">
            <input
              type="text"
              //ref={gameID}
              value={gameID}
              readOnly
              className="form-control"
            />
            <div className="input-group-append">
              <button
                className="btn btn-outline-secondary"
                onClick={copyToClipboard}
                type="button"
              >
                Copy Game Code
              </button>
            </div>
          </div>
          {copySuccess ? (
            <div className="alert alert-sucess" role="alert">
              Successfully Copied Game Code
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
