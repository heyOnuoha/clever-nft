import React from "react"

const defaultState = {
    hasAccessNFT: false,
}

const ApplicationContext = React.createContext([])

export const ApplicationProvider = ({ children }) => {

    const [state, setState] = React.useState(defaultState)

    const updateState = (newState, callback) => {
        setState({
            ...state,
            ...newState
        })

        if (callback) {
            setTimeout(() => callback(), 1000)
        }
    }

    return (
        <ApplicationContext.Provider value={{ state, updateState }}>
            {children}
        </ApplicationContext.Provider>
    )
}

export default ApplicationContext
