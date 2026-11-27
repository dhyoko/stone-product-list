import Check from '@mui/icons-material/Check';
import ContentCopy from '@mui/icons-material/ContentCopy';
import ErrorOutlined from '@mui/icons-material/ErrorOutlined';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useEffect, useState } from 'react';

const FEEDBACK_MS = 2000;

type CopyStatus = 'idle' | 'copied' | 'failed';

export function CopyButton(props: {
  readonly value: string;
  readonly label: string;
}): React.JSX.Element {
  const [status, setStatus] = useState<CopyStatus>('idle');

  useEffect(() => {
    if (status === 'idle') {
      return undefined;
    }
    const timeout = window.setTimeout(() => {
      setStatus('idle');
    }, FEEDBACK_MS);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [status]);

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(props.value);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
  };

  return (
    <Tooltip title={TOOLTIPS[status](props.label)}>
      <IconButton
        size="small"
        aria-label={`Copy the ${props.label}`}
        onClick={() => {
          void copy();
        }}
      >
        <StatusIcon status={status} />
      </IconButton>
    </Tooltip>
  );
}

const TOOLTIPS: Record<CopyStatus, (label: string) => string> = {
  idle: (label) => `Copy the ${label}`,
  copied: () => 'Copied',
  failed: () => 'The browser blocked the copy. Select the text instead.',
};

function StatusIcon({ status }: { readonly status: CopyStatus }): React.JSX.Element {
  switch (status) {
    case 'copied':
      return <Check fontSize="small" color="success" />;
    case 'failed':
      return <ErrorOutlined fontSize="small" color="error" />;
    case 'idle':
      return <ContentCopy fontSize="small" />;
  }
}
