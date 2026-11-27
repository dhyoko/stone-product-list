import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { useState } from 'react';

export function PasswordField(props: {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly error?: string;
}): React.JSX.Element {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <TextField
      label="Password"
      type={isVisible ? 'text' : 'password'}
      autoComplete="current-password"
      required
      fullWidth
      value={props.value}
      onChange={(event) => {
        props.onChange(event.target.value);
      }}
      error={props.error !== undefined}
      helperText={props.error}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={isVisible ? 'Hide the password' : 'Show the password'}
                edge="end"
                onClick={() => {
                  setIsVisible((current) => !current);
                }}
              >
                {isVisible ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
